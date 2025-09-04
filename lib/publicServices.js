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
}
