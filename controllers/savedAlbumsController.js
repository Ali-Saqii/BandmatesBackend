const SavedAlbums = require("../models/savedAlbums")

const savedAlbum = async (req, res) => {
    try{
        const userId = req.user.id;
        const { album_id, collection_id } = req.body

        if (!album_id || !collection_id) {
            return res.status(400).json({
                sucess: false,
                message: "album and collection required!!!"
            })
        }

        // check duplicate 
        const existing = await SavedAlbums.findOne({
            where:{
                user_id: userId,
                album_id,
                collection_id
            }
        })
        if (existing) {
            return res.status(409).json({
                sucess: false,
                message: "Album already saved in this collection"
            })
        }
        const saved = await SavedAlbums.create({
            user_id: userId,
            album_id,
            collection_id
        })
        return res.status(201).json({
            sucess: true,
            message: "Album sucessfully saved✅"
        })
    }catch(error){
        console.error("Enternal server error:",error)
        return res.status(500).json({
            sucess: false,
            message: "Internal server error❗️"
        })
    }
}

const removeAlbum = async (req, res) => {
    try{
        const userId = req.user.id;
        const { album_id, collection_id } = req.params;

        if (!album_id || !collection_id) {
            return res.status(400).json({
                sucess: false,
                message: "album and collection required!!!"
            })
        }
        const record  = await SavedAlbums.findOne({
            user_id: userId,
            album_id,
            collection_id

        })

        if (!record) {
            return res.status(404).json({
                sucess: false,
                message: "saved album not found to delete"
            })
        }
        record.isDeleted = true;
        await record.save();
        
        return res.status(200).json({
            success: true,
            message: "Album removed from collection"
        });


    }catch(error){
         console.error("Enternal server error:",error)
        return res.status(500).json({
            sucess: false,
            message: "Internal server error❗️"
        })
    }
}

module.exports = {
    savedAlbum,
    removeAlbum
}