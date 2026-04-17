const Collection = require("../models/colletionModel");
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
        // data: collection
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
// put collection 
const updateCollection = async (req,res) => {
    try {
        const{ id } = req.params;
        const { name,description } = req.body
     const userId = req.user.id;
        if (!id) {
            return res.status(400).json({
                sucess: false,
                message: "id should not be empty"
            })
        }

        const collection = await Collection.findOne({
            where:{
                id,
                user_id: userId
            }
        });

        if (!collection) {
            return res.status(404).json({
                sucess: false,
                message: "Collection jot found"
            })
        }
       const isEmpty = (val) =>
    val === undefined ||
    val === null ||
    (typeof val === "string" && val.trim() === "");

if (isEmpty(name) && isEmpty(description)) {
    return res.status(200).json({
        success: true,
        message: "No changes provided, collection remains same",
    });
}
        
        if(name !== undefined) collection.name = name;
        if(description !== undefined) collection.description = description;

        await collection.save();

        return res.status(200).json({
            sucess: true,
            message: "collection updated sucessfully"
        })
    }catch(error){
          console.error("🔥 Update Collection Error:", error);

        res.status(500).json({
            sucess:false,
            message: "internal server error"
        })
    }
}


module.exports = {
    createCollection,
    updateCollection
}