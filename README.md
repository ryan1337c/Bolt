This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## About
This application contains a beautiful user interface that utilizes the power of AI to automatically generate images based on user input.

Powered by OpenAI 

## Getting Started

First, install the dependencies:
```bash
npm install 
```
Now within the Image-AI folder:<br/><br/>
Create a .env file and put in your OpenAI API key in this format:
  ```bash
  NEXT_PUBLIC_OPENAI_API_KEY="YOUR_API_KEY"
  ```
Now run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Note:** <br/> 
  The login page and sign up page has not been fully implemented because that is not the focus of this application.
  In order to access the chat box:
  1. On the landing page, click the login button on the top right
  2. Fill in the text boxes, input doesn't matter but make sure that the text boxes are filled in
  3. Click the 'Sign In' button and it will redirect you to the chat page

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
