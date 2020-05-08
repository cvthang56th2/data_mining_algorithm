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

const build_TD_IFP_Tree = (itemsPhoBienArr = []) => {
  let resultObj = {
    root: {}
  }
  let headerList = {}
  let i = 1
  for (let item of itemsPhoBienArr) {
    let itemArr = item.split(';')
    let setPath = 'root'
    for (let e of itemArr) {
      setPath = `${setPath}.${e}`
      headerList[e] = setPath
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
    console.log('headerList: ' + i, headerList)
    i++
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
  // console.log('itemsPhoBien', itemsPhoBien)

  let TdIFpTreeObj = build_TD_IFP_Tree(itemsPhoBien)
  // console.log('FP-Tree: ', JSON.stringify(TdIFpTreeObj, 0, 2))

  let mauPhoBienArr = []
  // console.log('So muc thuong xuyen: ', mauPhoBienArr.length)
  // console.log('Tap thuong xuyen: ', mauPhoBienArr)
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

let fileName = 'test-tdifp-growth.txt'
let minSuppNum = 2
fileName = 'input/' + fileName
fpGrowthAlgorithm(fileName, minSuppNum)
