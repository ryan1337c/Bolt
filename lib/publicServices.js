import supabase from "./supabaseClient";

export class PublicServices {
  async fetchHistory(id) {
    const { data, error } = await supabase
      .from("history")
      .select("history, chat_id, created_at, chat_title")
      .eq("id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  }

  async updateHistory(user_email, history, chatId) {
    if (!chatId) {
      throw new Error("A chatId is required to update history.");
    }

    const { error } = await supabase
      .from("history")
      .update({ history: history })
      .eq("email", user_email)
      .eq("chat_id", chatId);

    if (error) throw error;
  }

  async updateChatTitle(user_email, chatId, newTitle) {
    if (!chatId) {
      throw new Error("A chatId is required to update chat title.");
    }

    const { error } = await supabase
      .from("history")
      .update({ chat_title: newTitle })
      .eq("email", user_email)
      .eq("chat_id", chatId);

    if (error) throw error;
  }

  async addHistory(user_id, user_email, history) {
    // Generate chat id
    const chatId = crypto.randomUUID();

    const firstUserMessage = history.find((msg) => msg.role === "user");
    // If a message is found, use its content; otherwise, use a default.
    const initialTitle = firstUserMessage
      ? firstUserMessage.content
      : "New Chat";

    const { data, error } = await supabase
      .from("history")
      .insert({
        id: user_id,
        email: user_email,
        history: history,
        chat_id: chatId,
        chat_title: initialTitle,
      })
      .select("history, chat_id, created_at, chat_title")
      .single();

    if (error) throw error;

    return data;
  }

  async deleteHistory(user_email, history, chat_id) {
    // Delete all current user images from bucket
    await Promise.all(
      history
        .filter((item) => item.role === "assistant")
        .map(async (item) => {
          console.log("image urls", item.imageUrl, ", ");
          const filePath = item.imageUrl
            .replace(
              "https://wpaysatiyftwgaoeubjh.supabase.co/storage/v1/object/public/images/",
              ""
            )
            .trim();
          const { data, error } = await supabase.storage
            .from("images")
            .remove([filePath]);
          console.log("Delete result:", data);
          console.log(filePath, ", ");
          if (error) {
            console.error(`Failed to delete ${filePath}:`, error.message);
          }
        })
    );

    // Empty out the user's chat history from the table
    const { error } = await supabase
      .from("history")
      .delete()
      .eq("email", user_email)
      .eq("chat_id", chat_id);

    if (error) throw error;
  }

  async uploadImage(imageUrl) {
    // Fetch the image
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;

    const imageResponse = await fetch(proxyUrl);

    // Get the image as a blob
    const blob = await imageResponse.blob();

    // Upload to supabase storage
    const fileName = `dalle/${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from("images")
      .upload(fileName, blob, {
        contentType: "image/png",
      });

    if (error) {
      console.error("Upload error", error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async createQuiz(title, id, mode, duration, count, description, questions) {
    // Add to quizzes table
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: id,
        title: title,
        mode: mode,
        duration: duration,
        count: count,
        description: description,
      })
      .select("id, title, mode, duration, count, description, created_at")
      .single();

    if (quizError) {
      throw quizError;
    }

    // Add to questions table
    const questionRows = questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: "mcq",
    }));

    const { data: insertQuestions, error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows)
      .select("id");

    if (questionsError) {
      throw questionsError;
    }

    // Add to choices table
    let choiceRows = [];
    questions.forEach((q, index) => {
      // Fetch current question id
      const questionId = insertQuestions[index].id;

      const correct_index = q.correct_index;

      q.choices.forEach((choice, index) => {
        choiceRows.push({
          question_id: questionId,
          choice_text: choice,
          is_correct: index === correct_index,
        });
      });
    });

    const { error: choicesError } = await supabase
      .from("choices")
      .insert(choiceRows);

    if (choicesError) {
      throw choicesError;
    }

    return quiz;
  }

  async getQuizzes(userId) {
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, mode, duration, count, description, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }); // most recent first

    if (error) throw error;

    return data;
  }

  async getQuizQuestions(quizId) {
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id, question_text, question_type, correct_answer")
      .eq("quiz_id", quizId);

    if (questionsError) throw questionsError;

    const questionIds = questionsData.map((q) => q.id);

    // Fetch all choices at once
    const { data: choicesData, error: choicesError } = await supabase
      .from("choices")
      .select("question_id, choice_text, is_correct")
      .in("question_id", questionIds);

    if (choicesError) throw choicesError;

    const choicesMap = choicesData.reduce((map, choice) => {
      if (!map.has(choice.question_id)) {
        map.set(choice.question_id, []);
      }
      map.get(choice.question_id).push(choice);
      return map;
    }, new Map());

    // Merge them together
    const questionsWithChoices = questionsData.map((q) => ({
      ...q,
      choices: choicesMap.get(q.id) || [],
    }));

    return questionsWithChoices;
  }

  async deleteQuiz(userId, quizId) {
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("user_id", userId)
      .eq("id", quizId);

    if (error) throw error;
  }

  async updateQuiz(quizId, title, description, duration, questions) {
    // Update the Quiz Metadata
    const { data: updatedQuiz, error: quizError } = await supabase
      .from("quizzes")
      .update({
        title: title,
        description: description,
        duration: duration,
        count: questions.length,
      })
      .eq("id", quizId)
      .select("id, title, mode, duration, count, description, created_at")
      .single();

    if (quizError) throw quizError;

    // Delete existing questions for this quiz
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);

    if (deleteError) throw deleteError;

    // Insert the new Questions
    const questionRows = questions.map((q) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      question_type: "mcq",
    }));

    const { data: insertQuestions, error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows)
      .select("id");

    if (questionsError) throw questionsError;

    // Insert the new Choices
    let choiceRows = [];

    questions.forEach((q, index) => {
      const questionId = insertQuestions[index].id;
      const correct_index = q.correct_index;

      q.choices.forEach((choiceText, cIndex) => {
        choiceRows.push({
          question_id: questionId,
          choice_text: choiceText,
          is_correct: cIndex === correct_index,
        });
      });
    });

    if (choiceRows.length > 0) {
      const { error: choicesError } = await supabase
        .from("choices")
        .insert(choiceRows);

      if (choicesError) throw choicesError;
    }

    return updatedQuiz;
  }
}
