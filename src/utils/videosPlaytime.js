const playtime = function (videos) {
    let days = 0, hours = 0, minutes = 0, seconds = 0
    videos.forEach(video => {
        const { day, hour, minute, second } = getTime(video.duration)
        days += day
        hours += hour
        minutes += minute
        seconds += second
    });
    if (seconds >= 60) {
        minutes += Math.floor(seconds / 60)
        seconds %= 60
    }
    if (minutes >= 60) {
        hours += Math.floor(minutes / 60)
        minutes %= 60
    }
    if (hours >= 24) {
        days += Math.floor(hours / 24)
        hours %= 24
    }
    // Formatting the time string
    let timeString = "";
    if (days > 0) {
        timeString += days + "D:";
    }
    if (hours > 0 || timeString) { // Include hours if there are days
        timeString += hours.toString().padStart(2, '0') + ":";
    }
    if (minutes > 0 || timeString) { // Include minutes if there are hours or days
        timeString += minutes.toString().padStart(2, '0') + ":";
    }
    timeString += seconds.toString().padStart(2, '0');
    return timeString
}

function getTime(playtime) {
    const regex = /PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = playtime.match(regex)
    const day = parseInt(match[1] || '0', 10);
    const hour = parseInt(match[2] || '0', 10);
    const minute = parseInt(match[3] || '0', 10);
    const second = parseInt(match[4] || '0', 10);
    return { day, hour, minute, second }
}

export { playtime }