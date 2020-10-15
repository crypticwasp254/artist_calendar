const fs = require('fs')
const path = require('path')

function StorageDir(storage_file) {
    console.log('[*] checking storage dir')
    const start_files = ['user_config.json', 'calendar_entries.json', 'calendar_dots.json']
    const start_dirs = ['image', 'video', 'html']
    // create the main dir
    fs.mkdir(storage_file, {}, (err) => {
        if (err) {
            if (err.code && err.code === 'EEXIST') {
                console.log('[*] .art_calendar directory exists')
            } else {
                console.log(err)
            }
        } else {
            console.log('[*] created directory .art_calendar at home')

            // create the files
            start_files.forEach((s_file) => {
                // :TODO  i shall revist this junk
                fs.readFile(path.join(storage_file, s_file), 'utf8', (sfile_err, content) => {
                    if (sfile_err) {
                        if (sfile_err.code && sfile_err.code === 'ENOENT') {
                            console.log(`[*] ${s_file} does not exists`)
                            console.log(`[*] creating ${s_file}`)
                            // create the file
                            fs.writeFile(path.join(storage_file, s_file), '', (create_err) => {
                                if (err) {
                                    console.log(create_err)
                                } else {
                                    console.log(`[*] created ${path.join(storage_file, s_file)}`)
                                }
                            })
                        } else {
                            console.log(err)
                        }
                    } else {
                        console.log(`[*]config file ${s_file} exists with ${content.substring(0, 10)}...`)
                        // console.log(content)
                    }
                })
            })
            // create logs dir
            fs.mkdir(path.join(storage_file, 'logs'), {}, (lfile_err) => {
                if (lfile_err) {
                    if (lfile_err.code && lfile_err.code === 'EEXIST') {
                        console.log('[*] logs directory exists')
                    } else {
                        console.log(lfile_err)
                    }
                } else {
                    console.log('[*] created logs directory')
                    // create log dirs
                    start_dirs.forEach((s_dir) => {
                        fs.mkdir(path.join(storage_file, 'logs', s_dir), {}, (create_err) => {
                            if (create_err) {
                                if (create_err.code && create_err.code === 'EEXIST') {
                                    console.log(`[*] ${s_dir} directory exists`)
                                } else {
                                    console.log(create_err)
                                }
                            } else {
                                console.log(`[*] created directory ${s_dir} at logs`)
                            }
                        })
                    })
                }
            })
        }
    })
}

module.exports = StorageDir
