function get_emails(str) {
  let nameArr = str.split(",");

  return nameArr;
}

let students = "lee@email.com, bruce@email.com, rita@email.com";
console.log(get_emails(students));

/*
mutation{
  email_enroll_multiple_students(group_id:"5eb58789880aeb2bd4795acf", student_contacts:["lee@email.com, bruce@email.com, rita@email.com"]){
    message
  }
}
*/
