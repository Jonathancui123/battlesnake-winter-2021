function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: "1",
    author: "",
    color: "#888888",
    head: "default",
    tail: "default",
  };
  response.status(200).json(battlesnakeInfo);
}

module.exports = handleIndex;
