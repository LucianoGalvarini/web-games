export type DamasVariantId = 'english' | 'criollas'

export type DamasVariant = {
  id: DamasVariantId
  label: string
  flyingKing: boolean
}

export const VARIANTS: Record<DamasVariantId, DamasVariant> = {
  english: {
    id: 'english',
    label: 'Inglesas',
    flyingKing: false,
  },
  criollas: {
    id: 'criollas',
    label: 'Criollas',
    flyingKing: true,
  },
}

export const DEFAULT_VARIANT: DamasVariantId = 'english'

export const VARIANT_ORDER: DamasVariantId[] = ['english', 'criollas']
