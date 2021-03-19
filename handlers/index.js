function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: "1",
    author: "POOOOOOOOOOOOOG",
    color: "#FF00FF",
    head: "gamer",
    tail: "weight",
  };
  response.status(200).json(battlesnakeInfo);
}

module.exports = handleIndex;
