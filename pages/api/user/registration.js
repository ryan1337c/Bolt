import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  console.log("Request received:", req.method, req.query);
  // Connect to MongoDB
  const client = await clientPromise;
  const db = client.db("ImageAI");

  switch (req.method) {
    // Registers new user
    case "POST":
      try {
        const { firstName, lastName, userName, password } = req.body;

        if (!firstName || !lastName || !userName || !password) {
          return res.status(400).json({
            success: false,
            message:
              "First name, last name, username, or password are required.",
          });
        }

        const query = {
          firstName: firstName,
          lastName: lastName,
          userName: userName,
          password: password,
        };

        // Insert data into collection
        const result = await db.collection("user").insertOne(query);

        res.status(201).json({
          success: true,
          message: "User added successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error adding user:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
      break;
    // Finds a user
    case "GET":
      try {
        const userName = req.query.userName;
        if (!userName) {
          return res
            .status(400)
            .json({ success: false, message: "Username is required." });
        }

        const query = {
          userName: userName,
        };

        // Find user
        const result = await db.collection("user").findOne(query);

        if (!result) {
          return res
            .status(400)
            .json({ success: false, message: "Username not found." });
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
      break;
  }
}
