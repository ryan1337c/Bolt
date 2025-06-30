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
}
