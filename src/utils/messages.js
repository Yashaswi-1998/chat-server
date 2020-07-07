const generateMessage = (username, text,_id) => {
    return {
        username,
        text,
        _id,
        createdAt: Date.now()
    }
}

module.exports = generateMessage