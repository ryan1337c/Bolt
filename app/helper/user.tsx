

let userInput = '';

export const handleUserInputChange =(value: string) => {
 
    try {
        console.log(userInput);
      userInput = value;
    }
    catch(error: unknown) {
      if (error instanceof Error)
        console.log(error.message + "?");
    }
    return userInput;
  } 

  export const getUserInput = () => {
    return userInput;
  }

