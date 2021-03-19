function handleIndex(request, response) {
  var battlesnakeInfo = {
    apiversion: "1.0",
    author: "POOOOOOOOOOOOOG",
    color: " #ff00ff",
    head: "gamer",
    tail: "weight",
  };
  response.status(200).json(battlesnakeInfo);
}

module.exports = handleIndex;
