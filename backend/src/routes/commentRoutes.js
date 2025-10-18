const express = require('express');
const {
  updateComment,
  deleteComment,
  voteOnComment,
} = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.put('/:commentId', authMiddleware, updateComment);
router.delete('/:commentId', authMiddleware, deleteComment);
router.post('/:commentId/vote', authMiddleware, voteOnComment);

module.exports = router;
