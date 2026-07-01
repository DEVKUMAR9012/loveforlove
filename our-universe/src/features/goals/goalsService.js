import { addDocument, getCollection, updateDocument, deleteDocument, subscribeToCollection, orderBy } from '../../lib/firestore'

const COLLECTION = 'goals'

export const listGoals = async (constraints = []) =>
  getCollection(COLLECTION, [orderBy('createdAt', 'desc'), ...constraints])

export const subscribeGoals = (constraints = [], callback) =>
  subscribeToCollection(COLLECTION, [orderBy('createdAt', 'desc'), ...constraints], callback)

export const createGoal = async (goal) =>
  addDocument(COLLECTION, goal)

export const updateGoal = async (id, changes) =>
  updateDocument(`${COLLECTION}/${id}`, changes)

export const deleteGoal = async (id) =>
  deleteDocument(`${COLLECTION}/${id}`)

export default {
  listGoals,
  subscribeGoals,
  createGoal,
  updateGoal,
  deleteGoal,
}
