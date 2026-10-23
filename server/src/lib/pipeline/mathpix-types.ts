// Mathpix v3/text 응답 중 파이프라인이 쓰는 부분만 정의
// https://docs.mathpix.com/#process-an-image

export type MathpixPoint = [number, number]

export type MathpixLine = {
  id?: string
  parent_id?: string
  type: string // "text" | "math" | "page_info" | "column" | "table" | "diagram" ...
  subtype?: string
  text?: string
  cnt?: MathpixPoint[]
  conversion_output?: boolean
}

export type MathpixResult = {
  image_width: number
  image_height: number
  text?: string
  line_data?: MathpixLine[]
  error?: string
}
