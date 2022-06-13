const element_0 = ROOT
const element_1 = element("h1")
const text_0 = text(`Hai World!`)
appendTo(element_1, text_0)
const text_1 = text(``)
const element_2 = element("p")
const text_2 = text(`This is a paragraph. \n`)
appendTo(element_2, text_2)
const text_3 = text(``)
const element_3 = element("button")
const text_4 = text(`Click me`)
appendTo(element_3, text_4)
const text_5 = text(``)
const text_6 = text(``)
const element_4 = element("h3")
const text_7 = text(`Count: {{ count }}`)
appendTo(element_4, text_7)
const text_8 = text(``)
function for_block_0(item, i) {
  const element_5 = element("p")
  const text_9 = text(`{{ item + "" + i }}`)
  appendTo(element_5, text_9)
  return {
    mount() {
      appendTo(ROOT, element_5)
    },
    destroy() {
      element_5.remove()
    },
  }
}
let array_0 = [1, 2, 3, 4, 5]
let pushed_0 = []
let counter_0 = 0
;[1, 2, 3, 4, 5].forEach((item, i) => {
  for_block_0(item, i)
})
appendTo(
  element_0,
  element_1,
  text_1,
  element_2,
  text_3,
  element_3,
  text_5,
  text_6,
  element_4,
  text_8,
  for_block_0
)
