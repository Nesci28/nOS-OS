module.exports = async function(json) {
  const simpleGit = require("simple-git/promise")();
  const restart = require("./restart");

  if (!json) {
    var json = {};
  }

  let localHash = async () => {
    let res = await simpleGit.revparse(["HEAD"]);
    return res.trim();
  };
  json["Local GitHash"] = await localHash();

  let remoteHash = async () => {
    let res = await simpleGit.listRemote(["--heads"]);
    res = res.replace(/\t/g, " ").split("\n");
    for (const hash of res) {
      if (hash.includes("refs/heads/master")) {
        res = hash.split(" ")[0];
        break;
      }
    }
    return res;
  };
  json["Remote GitHash"] = await remoteHash();

  if (
    json["Local GitHash"].replace(/[\n\t\r]/g, "") !==
    json["Remote GitHash"].replace(/[\n\t\r]/g, "")
  ) {
    console.log("Updating nOS to the lastest version... Please wait.");
    console.log("nOS will automatically restart afterward.");
    await simpleGit.pull("origin", "master");
    fs.writeFileSync(
      "../Logs/History.txt",
      new Date().getTime() +
        " Updated nOS to the latest Version. " +
        json["Remote GitHash"],
    );
    console.log("Updated nOS to the latest Version.");
    restart();
  }

  return json;
};
