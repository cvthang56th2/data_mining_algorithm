const fs = require('fs')
const moment = require('moment')
const _ = require('lodash')
const inquirer = require('inquirer')
let count = 0
// let minSuppNum = 2

const tinhTapKetNoiCp = (lObj = {}, index) => {
  let newArr = []
  let keys = Object.keys(lObj)
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      let itemArr = _.uniq(`${keys[i]};${keys[j]}`.split(';'))
      count++
      if (count % 1000) {
        // console.log('Tinh Tap Ket Noi - Giao tac thu ' + count)
      }
      if (itemArr.length === index) {
        newArr.push(itemArr.join(';'))
      }
    }
  }
  newArr = _.uniq(newArr)
  return newArr
}

const tinhTapUngVien = (dataArr = [], lObj = {}, cpArr) => {
  return cpArr.reduce((resultObj, cItemStr) => {
    let cItemArr = cItemStr.split(';')
    let flag = true
    for (let i = 0; i < cItemArr.length; i++) {
      let clonedArr = _.cloneDeep(cItemArr)
      clonedArr.splice(i, 1)
      let splicedStr = clonedArr.join(';')
      count++
      if (count % 1000) {
        // console.log('Tinh tap Ung vien - Giao tac thu ' + count)
      }
      if (!lObj[splicedStr]) {
        flag = false
        break
      }
    }
    if (flag) {
      for (let itemStr of dataArr) {
        let itemArr = itemStr.split(';')
        count++
        if (count % 1000) {
          // console.log('Tinh tap Ung vien - Giao tac thu ' + count)
        }
        if (hasSubArray(itemArr, cItemArr)) {
          resultObj[cItemStr] = (resultObj[cItemStr] || 0) + 1
        }
      }
    }
    return resultObj
  }, {})
}

const tinhTapThuongXuyenL = (cObj = {}, minSupp = 1) => {
  let lObj = {}
  for (let key in cObj) {
    let value = cObj[key]
    count++
    if (count % 1000) {
      // console.log('Tinh tap thuong xuyen - Giao tac thu ' + count)
    }
    if (value >= minSupp) {
      lObj[key] = value
    }
  }
  return lObj
}

const hasSubArray = (master, sub) => sub.every((i => v => i = master.indexOf(v, i) + 1)(0))

let aprioriAlgorythm = async (filename, logFileName, minSupp = 1) => {
  let logs = []
  const log = (str) => {
    logs.push(str)
    console.log(str)
  }
  log('Bat dau luc: ' + moment().format('HH:mm:ss A DD/MM/YYYY'))
  let data = []
  let dataFile = await fs.readFileSync(filename, 'utf8')
  data = dataFile.split(';\r\n').filter(e => e)

  // GENERATE DATA
  // const getRandInt = (min = 1, max = 100) => Math.floor(Math.random() * max) + min
  // for (let i = 0; i < 100; i++) {
  //   let numArr = []
  //   for (let j = 0; j <= getRandInt(1, 5); j++) {
  //     let numb = getRandInt(1, 100)
  //     while (numArr.includes(numb)) {
  //       numb = getRandInt(1, 100)
  //     }
  //     numArr.push(numb)
  //   }
  //   data.push(numArr.join(';'))
  // }
  log('Tap giao tac: Data :[\n\t' + data.join('\n\t') + '\n]')

  log(`Nguong Toi Thieu: ${minSupp}`)
  // Init C1, L1
  let idx = 1
  let cp1Arr = []
  log('Dang tinh CP1...')
  // Khởi tạo tập kết nối C'[1] => Tập ứng viên C[1]
  let c1Obj = data.reduce((resultObj, itemStr) => {
    let itemArr = itemStr.split(';')
    for (let item of itemArr) {
      count++
      if (count % 1000) {
        // console.log('Tinh tap Ung Vien - Giao tac thu ' + count)
      }
      resultObj[item] = (resultObj[item] || 0) + 1
      if (!cp1Arr.includes(item)) {
        cp1Arr.push(item)
      }
    }
    return resultObj
  }, {})
  log('CP1: [\n\t' + cp1Arr.join('\n\t') + '\n]')
  log(`Dang tinh C1...`)
  log('C1: ' + JSON.stringify(c1Obj))
  log(`Dang tinh L1...`)
  // Khởi tạo thường xuyên L1
  let lObj = tinhTapThuongXuyenL(c1Obj)
  log('L1: ' + JSON.stringify(lObj))
  idx++
  let resultObj = lObj
  let numOfL = 1
  
  let logsLoop = []
  // Cờ: nếu tập thường xuyên L rỗng thì dừng => Kết quả resultObj
  let flag = !!Object.keys(lObj).length
  while (flag) {
    // Đối với mỗi bước: Lần lượt tính tập kết nối cpArr => tính tập ứng viên cArr => Tính tập thường xuyên => Kiểm tra có rỗng không? Nếu rỗng thì dừng => xuất kết quả resultObj
    log(`Dang tinh CP${idx}...`)
    let cpArr = tinhTapKetNoiCp(lObj, idx)
    log(`CP${idx}: [\n\t` + cpArr.join('\n\t') + '\n]')
    log(`Dang tinh C${idx}...`)
    logsLoop.push(`Co ${cpArr.length} tap ket noi ${idx} muc du lieu`)
    let cObj = tinhTapUngVien(data, lObj, cpArr, idx)
    log(`C${idx}: ` + JSON.stringify(cObj))
    logsLoop.push(`Co ${Object.keys(cObj).length} tap ung vien ${idx} muc du lieu`)
    log(`Dang tinh L${idx}...`)
    lObj = tinhTapThuongXuyenL(cObj, minSupp, idx)
    logsLoop.push(`Co ${Object.keys(lObj).length} tap thuong xuyen ${idx} muc du lieu`)
    log(`L${idx}: ` + JSON.stringify(lObj))
    idx++
    resultObj = Object.assign(resultObj, lObj)
    if (!Object.keys(lObj).length) {
      flag = false
    } else {
      numOfL++
    }
  }
  log(`Co ${numOfL} muc du lieu thuong xuyen`)
  logs = [...logs, ...logsLoop]
  log(`Ket qua voi duoi dang object`)
  // log(JSON.stringify(resultObj))
  log(Object.keys(resultObj))
  log('Ket thuc luc: ' + moment().format('HH:mm:ss A DD/MM/YYYY'))
  if (fs.existsSync(logFileName)) {
    await fs.unlinkSync(logFileName)
  }
  await fs.writeFileSync(logFileName, logs.join('\n'))
}

var questions = [{
  type: 'input',
  name: 'fileName',
  message: "Nhap ten duong dan file: ",
}, {
  type: 'input',
  name: 'minSuppNum',
  message: "Nhap nguong toi thieu: ",
}]

inquirer.prompt(questions).then(answers => {
  let {fileName, minSuppNum} = answers || {}
  let logFileName = 'output/' + fileName
  fileName = 'input/' + fileName
  aprioriAlgorythm(fileName, logFileName, minSuppNum)
})