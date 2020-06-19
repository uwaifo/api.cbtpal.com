"use strict";
export const extract_from_link = (input) => {
  //find position of #
  let pound_position = input.indexOf("*");
  let email = input.substr(pound_position + 1, input.length);
  let host = input.substr(input[0], pound_position);

  return {
    email: email,
    author_url: host,
  };
};
