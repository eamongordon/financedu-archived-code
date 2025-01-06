export function hexToRGB(hex, alpha, array) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        if (array === true) {
            console.log(r);
            return [r, g, b];
        } else {
            return "rgb(" + r + ", " + g + ", " + b + ")";
        }
    }
}

export function moveArray(input, fromIn, to) {
    let numberOfDeletedElm = 1;
    const elm = input.splice(fromIn, numberOfDeletedElm)[0];
    numberOfDeletedElm = 0;
    input.splice(to, numberOfDeletedElm, elm);
    return input;
}

export function generateRandom(length) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

export const sortArray = (array, sortIndexArray) => {
    return [...array].sort(
        (a, b) => sortIndexArray.indexOf(a._id) - sortIndexArray.indexOf(b._id)
    )
}