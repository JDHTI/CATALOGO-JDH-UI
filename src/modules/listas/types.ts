import type { Producto } from "@/modules/catalogo"

export interface ListaPedido {
  id: string
  name: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface ListaPedidoItem {
  productId: string
  quantity: number
  productActive: boolean
  product: Producto
  createdAt: string
  updatedAt: string
}

export interface ListasMeta {
  total: number
  maxLists: number
}

export interface PaginaListaItemsMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ListasRespuesta {
  data: ListaPedido[]
  meta: ListasMeta
}

export interface ListaItemsRespuesta {
  data: ListaPedidoItem[]
  meta: PaginaListaItemsMeta
}
