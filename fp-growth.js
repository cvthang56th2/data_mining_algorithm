const _ = require('lodash')
const inquirer = require('inquirer')
const fs = require('fs')
const moment = require('moment')

// #region Function Gerate Sub Arrays
const show = (saveObj = {}, mappingArray = [], n) => {
  let str = ''
  for (let i = 1; i <= n; i++) {
    if (saveObj[i])
      str = str + ';' + mappingArray[i - 1]
  }
  return str
}

const generateSubArrays = (saveObj = {}, n, mappingArray, u, result = []) => {
  if (u === n + 1) {
    let str = show(saveObj, mappingArray, n)
    if (str) {
      result.push(str)
    }
    return
  }
  saveObj[u] = 0
  generateSubArrays(saveObj, n, mappingArray, u + 1, result)
  saveObj[u] = 1
  generateSubArrays(saveObj, n, mappingArray, u + 1, result)
}
// #endregion Function Gerate Sub Arrays

const build_FP_Tree = (itemsPhoBienArr = []) => {
  let resultObj = {
    root: {}
  }
  for (let item of itemsPhoBienArr) {
    let itemArr = item.split(';')
    let setPath = 'root'
    for (let e of itemArr) {
      setPath = `${setPath}.${e}`
      let path = _.get(resultObj, setPath)
      if (!path) {
        _.set(resultObj, setPath, {
          value: 1
        })
      } else {
        _.set(resultObj, setPath, {
          ...path,
          value: (path.value || 0) + 1
        })

      }
    }
  }
  return resultObj['root']
}

const tinhTapThuongXuyenL = (cObj = {}, minSupp = 1) => {
  let lObj = {}
  for (let key in cObj) {
      let value = cObj[key]
      if (value >= minSupp) {
        lObj[key] = value
      }
  }
  return lObj
}

let fpGrowthAlgorithm = async (fileName = '', minSupp = 1) => {
  console.log('fileName', fileName)
  let i = fileName[fileName.indexOf('_CH19') - 1]
  let j = fileName[fileName.indexOf('.txt') - 1]

  let startTime = moment().format('HH:mm:ss A DD/MM/YYYY')
  let data = []
  let dataFile = await fs.readFileSync(fileName, 'utf8')
  data = dataFile.split('\n').reduce((resultArr, item) => {
    let itemArr = item.split(';').filter(e => e && e !== '\r')
    if (itemArr.length) {
      resultArr.push(itemArr.join(';'))
    }
    return resultArr
  }, [])

  console.log('Tap giao tac Data: ', data)

  console.log(`Nguong Toi Thieu: ${minSupp}`)
  // Init C1, L1
  let idx = 1
  // Khởi tạo Tập ứng viên C[1]
  let c1Obj = data.reduce((resultObj, itemStr) => {
    let itemArr = itemStr.split(';')
    for (let item of itemArr) {
      resultObj[item] = (resultObj[item] || 0) + 1
    }
    return resultObj
  }, {})
  console.log(`Dang tinh C1...`)
  console.log('C1: ', c1Obj)
  console.log(`Dang tinh L1...`)
  // Khởi tạo thường xuyên L1
  let lObj = tinhTapThuongXuyenL(c1Obj, minSupp)
  console.log('L1: ', lObj)

  let lKeysSortedDescArr = Object.keys(lObj).sort((a,b) => lObj[b] - lObj[a])
  
  let itemsPhoBien = data.map(item => {
    let itemArr = item.split(';')
      .filter(e => {
        return lKeysSortedDescArr.includes(e)
      })
      .sort((a, b) => lKeysSortedDescArr.indexOf(a) - lKeysSortedDescArr.indexOf(b))
    return itemArr.join(';')
  })

  let fpTreeObj = build_FP_Tree(itemsPhoBien)
  console.log('FP-Tree: ', fpTreeObj)

  let lKeysSortedAscArr = Object.keys(lObj).sort((a,b) => lObj[a] - lObj[b])

  let flattenedFpTree = flattenObject(fpTreeObj)

  let keysSplittedFlattenedFpTreeArr = Object.keys(flattenedFpTree).map(e => e.replace('.value', '').split('.'))

  let coSoMauDieuKienObj = {}

  for (let e of lKeysSortedAscArr) {
    coSoMauDieuKienObj[e] = keysSplittedFlattenedFpTreeArr.reduce((resultObj, keyArr) => {
      let index = keyArr.indexOf(e)
      if (index !== -1) {
        let subKey = _.cloneDeep(keyArr).splice(0, index).join('.')
        if (subKey) {
          if (!resultObj[subKey]) {
            resultObj[subKey] = flattenedFpTree[subKey + '.' + keyArr[index] + '.value']
          }
        }
      }
      return resultObj
    }, {})
  }
  console.log('Co so mau dieu kien: ', coSoMauDieuKienObj)
  let mauPhoBienArr = []
  let ttx = []
  for (let key in coSoMauDieuKienObj) {
    let value = coSoMauDieuKienObj[key]
    mauPhoBienArr.push(key)
    let itemObj = {}
    for (let subKey in value) {
      let subKeyArr = subKey.split('.')
      let saveObj = {}
      let subArrays = []
      generateSubArrays(saveObj, subKeyArr.length, subKeyArr, 1, subArrays)
      for (let subStr of subArrays) {
        itemObj[subStr] = (itemObj[subStr] || 0) + value[subKey]
      }
    }
    for (let e in itemObj) {
      if (itemObj[e] >= minSupp) {
        mauPhoBienArr.push(key + e)
      }
    }
  }
  mauPhoBienArr = _.uniq(mauPhoBienArr)
  console.log('So muc thuong xuyen: ', mauPhoBienArr.length)
  console.log('Tap thuong xuyen: ', mauPhoBienArr)
  let endTime = moment().format('HH:mm:ss A DD/MM/YYYY')
  let logResultFileName = `output/fp-growth/FP_${minSupp}_D_${i}_${j}.txt`
  if (fs.existsSync(logResultFileName)) {
    await fs.unlinkSync(logResultFileName)
  }
  await fs.writeFileSync(logResultFileName, [
    `Tap D_${i}_CH19_${j} voi nguong toi thieu: ${minSupp}`,
    `Bat dau luc: ${startTime}`,
    `Co tat ca ${mauPhoBienArr.length} tap thuong xuyen`,
    `Ket thuc luc: ${endTime}`,
  ].join('\r\n'))
  // let logTtxFileName = `output/fp-growth/TTX_${minSupp}_D_${i}_CH19_${j}.txt`
  // if (fs.existsSync(logTtxFileName)) {
  //   await fs.unlinkSync(logTtxFileName)
  // }
  // await fs.writeFileSync(logTtxFileName, mauPhoBienArr.join(';\n') + ';')
  let outputFileDataObj = {}
  for (let itemStr of mauPhoBienArr) {
    let itemLength = itemStr.split(';').length
    if (!outputFileDataObj[itemLength]) {
      outputFileDataObj[itemLength] = []
    }
    outputFileDataObj[itemLength].push(itemStr)
  }
  for (let itemLength in outputFileDataObj) {
    let logTtxFileName = `output/fp-growth/TTX_${minSupp}_D_${i}_CH19_${j}_${itemLength}.txt`
    if (fs.existsSync(logTtxFileName)) {
      await fs.unlinkSync(logTtxFileName)
    }
    await fs.writeFileSync(logTtxFileName, outputFileDataObj[itemLength].join(';\r\n') + ';')
  }
}

const flattenObject = (obj) => {
	var toReturn = {}
	
	for (var i in obj) {
		if (!obj.hasOwnProperty(i)) continue
		
		if ((typeof obj[i]) == 'object') {
			var flatObject = flattenObject(obj[i])
			for (var x in flatObject) {
				if (!flatObject.hasOwnProperty(x)) continue
				
				toReturn[i + '.' + x] = flatObject[x]
			}
		} else {
			toReturn[i] = obj[i]
		}
	}
	return toReturn
}

let fileName = 'Data_3_CH19_9.txt'
let minSuppNum = 50
// let fileName = 'test-fp-growth.txt'
// let minSuppNum = 3
fileName = 'input/' + fileName
fpGrowthAlgorithm(fileName, minSuppNum)

// var questions = [{
//   type: 'input',
//   name: 'fileName',
//   message: "Nhap ten duong dan file: ",
// }, {
//   type: 'input',
//   name: 'minSuppNum',
//   message: "Nhap nguong toi thieu: ",
// }]

// inquirer.prompt(questions).then(answers => {
//   let {fileName, minSuppNum} = answers || {}
//   fileName = 'input/' + fileName
//   fpGrowthAlgorithm(fileName, minSuppNum)
// })