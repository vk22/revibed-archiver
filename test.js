const getTargetFolder = (mainFolder, innerFolders, folderName) => {
  innerFolders.forEach((item) => {
    let targetFolder = `${mainFolder}/${item}/${folderName}/RESTORED`
    if (fs.existsSync(targetFolder)) {
      return targetFolder
    }
  })
}

/// for i in *.png ; do convert "$i" "${i%.*}.jpg" ; done
