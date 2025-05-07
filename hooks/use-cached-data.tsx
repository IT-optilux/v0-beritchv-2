"use client"

import { useState, useEffect, useCallback } from "react"
import { useErrorHandler } from "./use-error-handler"
import { useOfflineOperations } from "./use-offline-operations"

interface CacheOptions {
  cacheKey: string
  expirationTime?: number // en milisegundos
}

export function useCachedData<T>(fetchFunction: () => Promise<T>, options: CacheOptions) {
  const [data, setData] = useState<T | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const { error, isLoading, handleError, setIsLoading } = useErrorHandler()
  const { isOnline } = useOfflineOperations()

  const { cacheKey, expirationTime = 5 * 60 * 1000 } = options // 5 minutos por defecto

  // Cargar datos desde la caché
  useEffect(() => {
    const loadFromCache = () => {
      try {
        const cachedData = localStorage.getItem(cacheKey)
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData)
          const isExpired = Date.now() - timestamp > expirationTime

          if (!isExpired) {
            setData(data)
            setLastUpdated(timestamp)
            return true
          }
        }
        return false
      } catch (error) {
        console.warn("Error al cargar datos desde caché:", error)
        return false
      }
    }

    if (!data && !isLoading) {
      const loadedFromCache = loadFromCache()
      if (!loadedFromCache) {
        fetchData()
      }
    }
  }, [cacheKey, expirationTime, data, isLoading])

  // Función para obtener datos frescos
  const fetchData = useCallback(
    async (force = false) => {
      if (!isOnline && !force) {
        // Si estamos offline y no es forzado, usar caché
        return
      }

      try {
        setIsLoading(true)
        const freshData = await fetchFunction()
        setData(freshData)

        const timestamp = Date.now()
        setLastUpdated(timestamp)

        // Guardar en caché
        localStorage.setItem(cacheKey, JSON.stringify({ data: freshData, timestamp }))
      } catch (error) {
        handleError(error, "Error al obtener datos")
      } finally {
        setIsLoading(false)
      }
    },
    [fetchFunction, cacheKey, isOnline, setIsLoading, handleError],
  )

  // Función para actualizar datos en caché sin hacer fetch
  const updateCache = useCallback(
    (updater: (currentData: T | null) => T) => {
      setData((currentData) => {
        const newData = updater(currentData)
        const timestamp = Date.now()
        setLastUpdated(timestamp)

        // Guardar en caché
        localStorage.setItem(cacheKey, JSON.stringify({ data: newData, timestamp }))

        return newData
      })
    },
    [cacheKey],
  )

  // Función para limpiar la caché
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey)
    setData(null)
    setLastUpdated(null)
  }, [cacheKey])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    fetchData,
    updateCache,
    clearCache,
    isStale: lastUpdated ? Date.now() - lastUpdated > expirationTime : true,
  }
}
