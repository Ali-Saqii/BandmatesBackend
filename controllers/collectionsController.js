const Collection = require("../models/colletionModel");
const { collection } = require("../models/colletionModel")
const { Op } = require('sequelize');

const createCollection = async (req, res) => {
    try {
    const{ name, description } = req.body
    const user_id = req.user.id

    if (!user_id) {
        return res.status(401).json({
            sucess: false,
            message: "in valid token"
        });
    }
    if (!name) {
        return res.status(400).json({
            sucess: false,
            message: "Collection Nme is Required"
        });
    }

    const collection = await Collection.create({
        user_id,
        name,
        description
    });
    res.status(201).json({
        sucess: true,
        message:"Collection created sucessfully",
        data: collection
    })
} catch (error) {
    console.error("❌ Create collection error:",error)
    res.status(500).json({
        sucess: false,
        message: "server error",
        error: error.message
    })
}
}
module.exports = {
    createCollection
}