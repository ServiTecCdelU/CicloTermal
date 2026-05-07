'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function TallesRemera() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      {/* Link para abrir el modal */}
      <button
        onClick={() => setShowModal(true)}
        className="text-blue-600 underline hover:text-blue-800"
      >
        Talles de remera
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>
            <Image
              src="/remera.jpg"
              alt="Tabla de talles de remera"
              width={400}
              height={300}
              className="rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}

//import TallesRemera from "@/components/TallesRemera"
//<TallesRemera />
