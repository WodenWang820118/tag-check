export function outputTime() {
  //output the time like the format: 2023-08-03 02:16:33
  const date: Date = new Date();

  let year: number = date.getFullYear();

  let month: number | string = date.getMonth() + 1; // getMonth() is zero-indexed, so we need to add 1
  month = month < 10 ? '0' + month : month; // ensure month is 2-digits

  let day: number | string = date.getDate();
  day = day < 10 ? '0' + day : day; // ensure day is 2-digits

  let hours: number | string = date.getHours();
  hours = hours < 10 ? '0' + hours : hours; // ensure hours is 2-digits

  let minutes: number | string = date.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes; // ensure minutes is 2-digits

  let seconds: number | string = date.getSeconds();
  seconds = seconds < 10 ? '0' + seconds : seconds; // ensure seconds is 2-digits

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
