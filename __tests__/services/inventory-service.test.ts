import {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/lib/services/inventory-service"
import { db } from "@/lib/firebase-client"
import { jest } from "@jest/globals"

// Mock de Firebase
jest.mock("@/lib/firebase-client", () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
  },
}))

describe("Inventory Service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getInventoryItems", () => {
    it("should return all inventory items", async () => {
      // Mock data
      const mockItems = [
        {
          id: "1",
          name: "Item 1",
          category: "Category 1",
          quantity: 10,
          minQuantity: 5,
          location: "Location 1",
          lastUpdated: new Date(),
          status: "En stock",
        },
        {
          id: "2",
          name: "Item 2",
          category: "Category 2",
          quantity: 3,
          minQuantity: 5,
          location: "Location 2",
          lastUpdated: new Date(),
          status: "Bajo stock",
        },
      ]

      // Mock implementation
      const mockQuerySnapshot = {
        docs: mockItems.map((item) => ({
          id: item.id,
          data: () => item,
        })),
      }

      const mockCollection = jest.fn().mockReturnThis()
      const mockQuery = jest.fn().mockReturnThis()
      const mockOrderBy = jest.fn().mockReturnThis()
      const mockGetDocs = jest.fn().mockResolvedValue(mockQuerySnapshot)

      db.collection.mockImplementation(mockCollection)
      db.query.mockImplementation(mockQuery)
      db.orderBy.mockImplementation(mockOrderBy)
      db.getDocs.mockImplementation(mockGetDocs)

      // Execute
      const result = await getInventoryItems()

      // Assert
      expect(db.collection).toHaveBeenCalledWith("inventory")
      expect(db.query).toHaveBeenCalled()
      expect(db.orderBy).toHaveBeenCalledWith("name", "asc")
      expect(db.getDocs).toHaveBeenCalled()
      expect(result).toEqual(mockItems)
    })
  })

  describe("getInventoryItem", () => {
    it("should return a specific inventory item", async () => {
      // Mock data
      const mockItem = {
        id: "1",
        name: "Item 1",
        category: "Category 1",
        quantity: 10,
        minQuantity: 5,
        location: "Location 1",
        lastUpdated: new Date(),
        status: "En stock",
      }

      // Mock implementation
      const mockDocSnapshot = {
        exists: true,
        id: mockItem.id,
        data: () => mockItem,
      }

      const mockDoc = jest.fn().mockReturnThis()
      const mockGetDoc = jest.fn().mockResolvedValue(mockDocSnapshot)

      db.doc.mockImplementation(mockDoc)
      db.getDoc.mockImplementation(mockGetDoc)

      // Execute
      const result = await getInventoryItem("1")

      // Assert
      expect(db.doc).toHaveBeenCalledWith("inventory/1")
      expect(db.getDoc).toHaveBeenCalled()
      expect(result).toEqual(mockItem)
    })

    it("should return null if item does not exist", async () => {
      // Mock implementation
      const mockDocSnapshot = {
        exists: false,
      }

      const mockDoc = jest.fn().mockReturnThis()
      const mockGetDoc = jest.fn().mockResolvedValue(mockDocSnapshot)

      db.doc.mockImplementation(mockDoc)
      db.getDoc.mockImplementation(mockGetDoc)

      // Execute
      const result = await getInventoryItem("999")

      // Assert
      expect(db.doc).toHaveBeenCalledWith("inventory/999")
      expect(db.getDoc).toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe("createInventoryItem", () => {
    it("should create a new inventory item", async () => {
      // Mock data
      const newItem = {
        name: "New Item",
        category: "New Category",
        quantity: 15,
        minQuantity: 5,
        location: "New Location",
      }

      const mockAddDoc = jest.fn().mockResolvedValue({ id: "new-id" })
      db.collection.mockReturnThis()
      db.addDoc.mockImplementation(mockAddDoc)
      db.serverTimestamp.mockReturnValue("timestamp")

      // Execute
      const result = await createInventoryItem(newItem)

      // Assert
      expect(db.collection).toHaveBeenCalledWith("inventory")
      expect(db.addDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newItem,
          createdAt: "timestamp",
          updatedAt: "timestamp",
          status: "En stock",
        }),
      )
      expect(result).toEqual({
        id: "new-id",
        ...newItem,
        createdAt: "timestamp",
        updatedAt: "timestamp",
        status: "En stock",
      })
    })
  })

  describe("updateInventoryItem", () => {
    it("should update an existing inventory item", async () => {
      // Mock data
      const itemId = "1"
      const updateData = {
        name: "Updated Item",
        quantity: 20,
      }

      const mockUpdateDoc = jest.fn().mockResolvedValue({})
      db.doc.mockReturnThis()
      db.updateDoc.mockImplementation(mockUpdateDoc)
      db.serverTimestamp.mockReturnValue("timestamp")

      // Execute
      await updateInventoryItem(itemId, updateData)

      // Assert
      expect(db.doc).toHaveBeenCalledWith("inventory/1")
      expect(db.updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedAt: "timestamp",
        }),
      )
    })
  })

  describe("deleteInventoryItem", () => {
    it("should delete an inventory item", async () => {
      // Mock data
      const itemId = "1"

      const mockDeleteDoc = jest.fn().mockResolvedValue({})
      db.doc.mockReturnThis()
      db.deleteDoc.mockImplementation(mockDeleteDoc)

      // Execute
      await deleteInventoryItem(itemId)

      // Assert
      expect(db.doc).toHaveBeenCalledWith("inventory/1")
      expect(db.deleteDoc).toHaveBeenCalled()
    })
  })
})
