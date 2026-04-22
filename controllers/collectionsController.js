const { Collection, SavedAlbum, Album, Review, Comment, User } = require("../models");
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
        success: true,
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
                success: false,
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
                success: false,
                message: "Collection not found"
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
            success: true,
            message: "collection updated sucessfully"
        })
    }catch(error){
          console.error("🔥 Update Collection Error:", error);

        res.status(500).json({
            success:false,
            message: "internal server error"
        })
    }
}


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

        // collection.isDeleted = true; /// soft delete
        // await collection.save();
         await collection.destroy();
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

// get collection

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

        const limit  = 6;
        const offset = (page - 1) * limit;

        // 🗃️ 3. Fetch collections with full nested data
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
                            as: "album",
                            include: [
                                {
                                    model: Review,
                                    as: "reviews",
                                    include: [
                                        { model: User, as: "user", attributes: ["username", "avatar"] }
                                    ]
                                },
                                {
                                    model: Comment,
                                    as: "comments",
                                    where: { parent_id: null },
                                    required: false,
                                    include: [
                                        { model: User, as: "user", attributes: ["username", "avatar"] }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 📭 4. No data case
        if (!rows || rows.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No collections found",
                data: [],
                pagination: {
                    totalItems:  0,
                    currentPage: page,
                    totalPages:  0,
                    perPage:     limit
                }
            });
        }

        // ✅ 5. Success response
        return res.status(200).json({
            success: true,
            message: "Collections fetched successfully",
            data: rows.map(collection => ({
                id:                    collection.id,
                collectionTitle:       collection.name,
                collectionDescription: collection.description,
                savedAlbums: (collection.savedAlbums || []).map(saved => {
                    const album = saved.album;
                    if (!album) return null;

                    const reviews = (album.reviews || []).map(r => ({
                        id:           r.id,
                        personImage:  r.user?.avatar   || "",
                        personName:   r.user?.username || "Anonymous",
                        dateOfRating: r.createdAt,
                        rating:       parseFloat(r.rating || 0),
                        reviewBody:   r.review_text    || ""
                    }));

                    const replies = (album.replies || []).map(c => ({
                        id:          c.id,
                        image:       c.user?.avatar      || "",
                        name:        c.user?.username    || "Anonymous",
                        disPlayName: c.user?.displayName || null,
                        replieText:  c.text,
                        replieTime:  c.createdAt
                    }));

                    const averageRating = reviews.length > 0
                        ? parseFloat(
                            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                          )
                        : 0;

                    return {
                        id:               album.id,
                        image:            album.cover  || "",
                        albumName:        album.name   || "",
                        albumArtistName:  album.artist || "",
                        releaseDate:      album.createdAt,
                        averageRating,
                        totalRatingCount: reviews.length,
                        reviews,
                        replies,
                        isSaved:          true,
                        albumPlayLink:    `https://www.last.fm/music/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.name)}`
                    };
                }).filter(Boolean)
            })),
            pagination: {
                totalItems:  count,
                currentPage: page,
                totalPages:  Math.ceil(count / limit),
                perPage:     limit
            }
        });

    } catch (error) {
        console.error("🔥 Get Collections Error:", error);

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

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


module.exports = {
    createCollection,
    updateCollection,
    getUserCollection,
    deleteCollection
}