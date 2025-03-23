const express = require("express");
const { getUsers, createUser, deleteUser } = require("../controllers/usersController");
const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.delete("/:id", deleteUser);

module.exports = router;
