import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  console.log("Request received:", req.method, req.query);

  if (req.method === "GET") {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("ImageAI");

    try {
      const { userName, password } = req.query;
      if (!userName || !password) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Username or password is required.",
          });
      }

      const query = {
        userName: userName,
        password: password,
      };

      // Find user
      const result = await db.collection("user").findOne(query);

      if (!result) {
        return res
          .status(400)
          .json({ success: false, message: "User not found." });
      }

      res.status(200).json({
        status: true,
        message: "User successfully found.",
        data: result,
      });
    } catch (error) {
      console.error("Error finding user:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
}
