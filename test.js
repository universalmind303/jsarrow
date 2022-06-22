
const arr = [1,2,3]
function mutateArray(array) {
  array.shift()
  
}
mutateArray(arr)
const buf = Buffer.from("i am a big long string")

console.log(buf.slice(3).toString())