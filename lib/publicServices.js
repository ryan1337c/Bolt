import supabase from "./supabaseClient";

export class PublicServices {
  async fetchHistory(user_id) {
    const { data, error } = await supabase
      .from("history")
      .select("history")
      .eq("id", user_id);

    if (error) throw error;

    if (!data[0]?.history) {
      return false;
    }

    return data[0]?.history;
  }

  async updateHistory(user_id, history) {
    const { error } = await supabase
      .from("history")
      .update({ history: history })
      .eq("id", user_id);

    if (error) throw error;
  }

  async addHistory(user_id) {
    const { error } = await supabase
      .from("history")
      .insert({ id: user_id, history: [] });

    if (error) throw error;
  }

  async deleteHistory(user_id, history) {
    // Delete all current user images from bucket
    await Promise.all(
      history
        .filter((item) => item.sender === "ai")
        .map(async (item) => {
          const filePath = item.imageUrl.replace(
            "https://wpaysatiyftwgaoeubjh.supabase.co/storage/v1/object/public/images/",
            ""
          );
          const { error } = await supabase.storage
            .from("images")
            .remove([filePath]);
          if (error) {
            console.error(`Failed to delete ${filePath}:`, error.message);
          }
        })
    );

    // Empty out the user's chat history from the table
    const { error } = await supabase
      .from("history")
      .update({ history: [] })
      .eq("id", user_id);

    if (error) throw error;
  }
}
