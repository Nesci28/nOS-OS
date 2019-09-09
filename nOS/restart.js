const cp = require("child_process");

module.exports = async function restart() {
    const startOutput = start();
    startOutput.stdout.on("data", data => {
        console.log(data.toString().trim());
    });
};

function start() {
    return cp.exec(
        `cd ${findnOS()}; DISPLAY=:0 XAUTHORITY=${findXAuthority()} ./start.sh`
    );
}

function findnOS() {
    return cp
        .execSync("sudo find /home -name nOS")
        .toString()
        .trim();
}

function findXAuthority() {
    return cp
        .execSync(
            "ps -u $(id -u) -o pid= | xargs -I{} cat /proc/{}/environ 2>/dev/null | tr '\\0' '\\n' | grep -m1 '^XAUTHORITY='"
        )
        .toString()
        .trim()
        .split("=")[1];
}