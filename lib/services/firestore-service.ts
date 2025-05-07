"use client"

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { firestore } from "@/lib/firebase-client"

export class FirestoreService<T extends { id?: string }> {
  protected collectionName: string

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  protected getCollection() {
    if (!firestore) throw new Error("Firestore no está inicializado")
    return collection(firestore, this.collectionName)
  }

  protected getDocRef(id: string) {
    if (!firestore) throw new Error("Firestore no está inicializado")
    return doc(firestore, this.collectionName, id)
  }

  protected mapToModel(doc: DocumentData): T {
    const data = doc.data()

    // Convertir Timestamp a Date
    const processedData = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value instanceof Timestamp) {
          acc[key] = value.toDate()
        } else {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return {
      id: doc.id,
      ...processedData,
    } as T
  }

  protected prepareForFirestore(data: Partial<T>): Record<string, any> {
    const { id, ...rest } = data as any

    // Convertir Date a Timestamp
    const processedData = Object.entries(rest).reduce(
      (acc, [key, value]) => {
        if (value instanceof Date) {
          acc[key] = Timestamp.fromDate(value)
        } else {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return processedData
  }

  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(this.getCollection())
      return querySnapshot.docs.map((doc) => this.mapToModel(doc))
    } catch (error) {
      console.error(`Error al obtener todos los documentos de ${this.collectionName}:`, error)
      throw error
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return this.mapToModel(docSnap)
      } else {
        return null
      }
    } catch (error) {
      console.error(`Error al obtener documento ${id} de ${this.collectionName}:`, error)
      throw error
    }
  }

  async create(data: Omit<T, "id">): Promise<T> {
    try {
      const docData = this.prepareForFirestore(data as Partial<T>)
      docData.createdAt = serverTimestamp()
      docData.updatedAt = serverTimestamp()

      const docRef = await addDoc(this.getCollection(), docData)
      const newDoc = await getDoc(docRef)

      return this.mapToModel(newDoc)
    } catch (error) {
      console.error(`Error al crear documento en ${this.collectionName}:`, error)
      throw error
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const docRef = this.getDocRef(id)
      const docData = this.prepareForFirestore(data)
      docData.updatedAt = serverTimestamp()

      await updateDoc(docRef, docData)
      const updatedDoc = await getDoc(docRef)

      if (!updatedDoc.exists()) {
        throw new Error(`Documento ${id} no encontrado en ${this.collectionName}`)
      }

      return this.mapToModel(updatedDoc)
    } catch (error) {
      console.error(`Error al actualizar documento ${id} en ${this.collectionName}:`, error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Error al eliminar documento ${id} de ${this.collectionName}:`, error)
      throw error
    }
  }

  async query(
    constraints: QueryConstraint[],
    pageSize = 20,
    lastDoc?: DocumentSnapshot,
  ): Promise<{
    items: T[]
    lastDoc: DocumentSnapshot | null
    hasMore: boolean
  }> {
    try {
      let q = query(this.getCollection(), ...constraints, limit(pageSize + 1))

      if (lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const querySnapshot = await getDocs(q)
      const hasMore = querySnapshot.docs.length > pageSize
      const docs = hasMore ? querySnapshot.docs.slice(0, pageSize) : querySnapshot.docs

      return {
        items: docs.map((doc) => this.mapToModel(doc)),
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
        hasMore,
      }
    } catch (error) {
      console.error(`Error al consultar documentos de ${this.collectionName}:`, error)
      throw error
    }
  }
}
