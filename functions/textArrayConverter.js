function textArrayConverter(string) {

    const arr = string.split(',')

    const formattedKeywords = arr.map(keyword => `"${keyword}"`).join(', ')

    const finalResult = `{${formattedKeywords}}`

    return finalResult;
}

module.exports = textArrayConverter;
