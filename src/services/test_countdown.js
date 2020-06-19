"use strict";
export let time_left = "";
export const test_countdown = (test_time) => {
  ///
  let counter = test_time;
  const intervalId = setInterval(() => {
    //console.log(`Time Left : ${counter}`);
    //counter += 1;
    counter--;
    //time_left = `Time Left : ${counter}`;
    if (counter === 0) {
      console.log("Done");
      clearInterval(intervalId);
    }
  }, 1000);
  ///
};
