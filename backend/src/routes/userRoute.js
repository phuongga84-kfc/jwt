import express from 'express'
import {
  authMe,
  deleteUser,
  listUsers,
  updateUser,
} from '../controllers/userController.js'
import { adminOnly } from '../middlewares/adminMiddleware.js'

const router = express.Router()

router.get('/me', authMe)
router.get('/', listUsers)
router.patch('/:userId', adminOnly, updateUser)
router.delete('/:userId', adminOnly, deleteUser)

export default router