const { Collection, SavedAlbum, Album } = require("../models");
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

// get collections

// const getUserCollection = async (req , res) => {
//     try {
//         const userId = req.user.id;

//         const page = parseInt(req.query.page) || 1;
//         const limit = 6;
//         const offset = (page - 1) * limit;

//         const { rows, count} = await Collection.findAndCountAll({
//             where:{
//                 user_id: userId
//             },
//             limit,
//             offset,
//             order:[["createdAt","DESC"]]
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Collections fetched successfully",
//             data: rows,
//             pagination: {
//                 totalItems: count,
//                 currentPage: page,
//                 totalPages: Math.ceil(count / limit),
//                 perPage: limit
//             }
//         });

//     } catch (error) {
//   console.error("🔥 Get Collections Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }


const getUserCollection = async (req, res) => {
    try {
        // 🔐 1. Auth check
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access"
            });
        }

        const userId = req.user.id;

        // 📄 2. Validate pagination
        let page = parseInt(req.query.page);
        if (isNaN(page) || page < 1) page = 1;

        const limit = 6;
        const offset = (page - 1) * limit;

        // 🗃️ 3. Fetch collections
        const { rows, count } = await Collection.findAndCountAll({
            where: { user_id: userId },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: SavedAlbum,
                    as: "savedAlbums",
                    include: [
                        {
                            model: Album,
                            as: "album"
                        }
                    ]
                }
            ]
        });

        // 📭 4. No data case (NOT an error, but handle it cleanly)
        if (!rows || rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No collections found",
                data: [],
                pagination: {
                    totalItems: 0,
                    currentPage: page,
                    totalPages: 0,
                    perPage: limit
                }
            });
        }

        // ✅ 5. Success response
        return res.status(200).json({
            success: true,
            message: "Collections fetched successfully",
            data: rows,
            pagination: {
                totalItems: count,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                perPage: limit
            }
        });

    } catch (error) {
        console.error("🔥 Get Collections Error:", error);

        // ⚠️ 6. Sequelize-specific errors (EXPECTED)
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: error.errors.map(e => e.message)
            });
        }

        if (error.name === "SequelizeDatabaseError") {
            return res.status(400).json({
                success: false,
                message: "Database query error"
            });
        }

        // 💥 7. Unknown error (fallback)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
const deleteCollection = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Collection id is required"
            });
        }

        const collection = await Collection.findOne({
            where: {
                id,
                user_id: userId
            }
        });

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: "Collection not found"
            });
        }

        collection.isDeleted = true;
        await collection.save();

        return res.status(200).json({
            success: true,
            message: "Collection deleted successfully"
        });

    } catch (error) {
        console.error("🔥 Delete Collection Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    createCollection,
    updateCollection,
    getUserCollection,
    deleteCollection
}