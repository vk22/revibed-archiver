const getTargetFolder = (mainFolder, innerFolders, folderName) => {
  innerFolders.forEach((item) => {
    let targetFolder = `${mainFolder}/${item}/${folderName}/RESTORED`
    if (fs.existsSync(targetFolder)) {
      return targetFolder
    }
  })
}

/// for i in *.png ; do convert "$i" "${i%.*}.jpg" ; done
/// 

ffprobe -v error -f lavfi -i "amovie=1.flac,asetnsamples=11025,astats=metadata=1:reset=1" -show_entries frame=pts_time -show_entries frame_tags=lavfi.astats.Overall.Peak_level,lavfi.astats.Overall.RMS_level -of json

