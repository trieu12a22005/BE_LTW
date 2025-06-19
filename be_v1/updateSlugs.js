require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI);

const dynamicSchema = new mongoose.Schema({}, {
    strict: false
});
const Document = mongoose.model("Document", dynamicSchema, "documents");
const Post = mongoose.model("Post", dynamicSchema, "posts");

function slugify(str) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function extractDateFromSlug(slug) {
    const match = slug ? slug.match(/-(\d{4}-\d{2}-\d{2})$/) : null;
    return match ? match[1] : null;
}

async function updateSlugsForModel(Model, label) {
    const docs = await Model.find({}); // lấy tất cả

    for (const doc of docs) {
        const title = doc.get("title") || "untitled";
        const createdAt = doc.get("createdAt") || new Date();
        const dateStr = new Date(createdAt).toISOString().split("T")[0];
        const correctSlug = `${slugify(title)}-${dateStr}`;

        const currentSlug = doc.get("slug");

        const currentDateInSlug = extractDateFromSlug(currentSlug);
        if (!currentSlug || currentDateInSlug !== dateStr) {
            doc.set("slug", correctSlug);
            await doc.save();
            console.log(`✔ [${label}] ${title} → ${correctSlug}`);
        }
    }
}

async function main() {
    try {
        console.log("🔄 Đang kiểm tra và cập nhật slug...");
        await updateSlugsForModel(Document, "Document");
        await updateSlugsForModel(Post, "Post");
        console.log("✅ Hoàn tất cập nhật slug.");
    } catch (err) {
        console.error("❌ Lỗi:", err);
    } finally {
        mongoose.disconnect();
    }
}

main();
