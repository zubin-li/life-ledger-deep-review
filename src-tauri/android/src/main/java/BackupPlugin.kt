// SPDX-License-Identifier: Apache-2.0 OR MIT
package app.zubinli.lifeledger.androidtest.backup

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import android.util.Base64
import androidx.activity.result.ActivityResult
import app.tauri.Logger
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger
import java.util.zip.CRC32

private const val BUFFER_SIZE = 65536

@InvokeArg
class PickExportArgs {
    var fileName: String? = null
    var mimeType: String? = null
}

@InvokeArg
class UriArgs {
    lateinit var uri: String
}

@InvokeArg
class WriteOpenArgs {
    lateinit var uri: String
}

@InvokeArg
class WriteChunkArgs {
    var handle: Int = 0
    var data: String = ""
}

@InvokeArg
class HandleArgs {
    var handle: Int = 0
}

@InvokeArg
class ReadChunkArgs {
    var handle: Int = 0
    var maxBytes: Int = BUFFER_SIZE
}

private class WriteSession(stream: BufferedOutputStream, val pfd: ParcelFileDescriptor?) {
    val stream: BufferedOutputStream = stream
    val checksum = CRC32()
}

private class ReadSession(
    val stream: BufferedInputStream,
    val pfd: ParcelFileDescriptor?,
) {
    val checksum = CRC32()
}

@TauriPlugin
class BackupPlugin(private val activity: Activity) : Plugin(activity) {
    private val writeSessions = ConcurrentHashMap<Int, WriteSession>()
    private val readSessions = ConcurrentHashMap<Int, ReadSession>()
    private val nextHandle = AtomicInteger(1)
    private val ioExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    @Command
    fun pickImport(invoke: Invoke) {
        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT)
            intent.addCategory(Intent.CATEGORY_OPENABLE)
            intent.type = "*/*"
            intent.putExtra(
                Intent.EXTRA_MIME_TYPES,
                arrayOf(
                    "application/json",
                    "text/plain",
                    "application/octet-stream",
                    "application/x-life-ledger-media",
                ),
            )
            startActivityForResult(invoke, intent, "importPickResult")
        } catch (ex: Exception) {
            val message = ex.message ?: "Failed to open document picker"
            Logger.error(message)
            invoke.reject(message)
        }
    }

    @ActivityCallback
    fun importPickResult(invoke: Invoke, result: ActivityResult) {
        try {
            when (result.resultCode) {
                Activity.RESULT_OK -> {
                    val uri = result.data?.data
                    if (uri == null) {
                        invoke.reject("No document selected")
                        return
                    }
                    ioExecutor.execute {
                        try {
                            val displayName = queryDisplayName(uri) ?: "life-ledger-backup"
                            val ret = JSObject()
                            ret.put("cancelled", false)
                            ret.put("uri", uri.toString())
                            ret.put("displayName", displayName)
                            invoke.resolve(ret)
                        } catch (ex: Exception) {
                            invoke.reject(ex.message ?: "Failed to read document metadata")
                        }
                    }
                }
                Activity.RESULT_CANCELED -> {
                    val ret = JSObject()
                    ret.put("cancelled", true)
                    invoke.resolve(ret)
                }
                else -> invoke.reject("Failed to open document")
            }
        } catch (ex: Exception) {
            invoke.reject(ex.message ?: "Failed to read import picker result")
        }
    }

    @Command
    fun pickExport(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(PickExportArgs::class.java)
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT)
            intent.addCategory(Intent.CATEGORY_OPENABLE)
            intent.putExtra(Intent.EXTRA_TITLE, args.fileName ?: "life-ledger-backup")
            intent.type = args.mimeType?.takeIf { it.isNotBlank() } ?: "application/octet-stream"

            startActivityForResult(invoke, intent, "exportPickResult")
        } catch (ex: Exception) {
            invoke.reject(ex.message ?: "Failed to open save picker")
        }
    }

    @ActivityCallback
    fun exportPickResult(invoke: Invoke, result: ActivityResult) {
        try {
            when (result.resultCode) {
                Activity.RESULT_OK -> {
                    val uri = result.data?.data
                    if (uri == null) {
                        invoke.reject("No destination selected")
                        return
                    }
                    val ret = JSObject()
                    ret.put("cancelled", false)
                    ret.put("uri", uri.toString())
                    invoke.resolve(ret)
                }
                Activity.RESULT_CANCELED -> {
                    val ret = JSObject()
                    ret.put("cancelled", true)
                    invoke.resolve(ret)
                }
                else -> invoke.reject("Failed to create document")
            }
        } catch (ex: Exception) {
            invoke.reject(ex.message ?: "Failed to read export picker result")
        }
    }

    @Command
    fun documentLength(invoke: Invoke) {
        ioExecutor.execute {
            try {
                val args = invoke.parseArgs(UriArgs::class.java)
                val uri = Uri.parse(args.uri)
                val length = queryLength(uri)
                if (length < 0) {
                    invoke.reject("Unable to read document length")
                    return@execute
                }
                val ret = JSObject()
                ret.put("length", length)
                invoke.resolve(ret)
            } catch (ex: Exception) {
                invoke.reject(ex.message ?: "documentLength failed")
            }
        }
    }

    @Command
    fun openWrite(invoke: Invoke) {
        ioExecutor.execute {
            var opened: ParcelFileDescriptor? = null
            var stream: BufferedOutputStream? = null
            try {
                val args = invoke.parseArgs(WriteOpenArgs::class.java)
                val uri = Uri.parse(args.uri)
                opened = activity.contentResolver.openFileDescriptor(uri, "wt")
                if (opened == null) {
                    invoke.reject("Unable to open document for writing")
                    return@execute
                }
                val handle = nextHandle.getAndIncrement()
                val pfd = opened
                stream = BufferedOutputStream(ParcelFileDescriptor.AutoCloseOutputStream(pfd), BUFFER_SIZE)
                opened = null
                writeSessions[handle] = WriteSession(stream, pfd)
                val ret = JSObject()
                ret.put("handle", handle)
                invoke.resolve(ret)
            } catch (ex: Exception) {
                try { stream?.close() } catch (_: Throwable) {}
                try { opened?.close() } catch (_: Throwable) {}
                invoke.reject(ex.message ?: "openWrite failed")
            }
        }
    }

    @Command
    fun writeChunk(invoke: Invoke) {
        ioExecutor.execute {
            try {
                val args = invoke.parseArgs(WriteChunkArgs::class.java)
                val session = writeSessions[args.handle]
                    ?: run {
                        invoke.reject("invalid-write-handle")
                        return@execute
                    }
                val bytes = Base64.decode(args.data, Base64.DEFAULT)
                session.stream.write(bytes)
                session.checksum.update(bytes)
                val ret = JSObject()
                ret.put("written", bytes.size)
                invoke.resolve(ret)
            } catch (ex: Exception) {
                invoke.reject(ex.message ?: "writeChunk failed")
            }
        }
    }

    @Command
    fun closeWrite(invoke: Invoke) {
        ioExecutor.execute {
            try {
                val args = invoke.parseArgs(HandleArgs::class.java)
                val session = writeSessions.remove(args.handle)
                    ?: run {
                        invoke.reject("invalid-write-handle")
                        return@execute
                    }
                var flushError: Throwable? = null
                try {
                    session.stream.flush()
                } catch (t: Throwable) {
                    flushError = t
                }
                var closeError: Throwable? = null
                try {
                    session.stream.close()
                } catch (t: Throwable) {
                    closeError = t
                }
                try {
                    session.pfd?.close()
                } catch (_: Throwable) {}

                if (flushError != null) throw (flushError as? Exception ?: Exception(flushError))
                if (closeError != null) throw (closeError as? Exception ?: Exception(closeError))

                val ret = JSObject()
                ret.put("checksum", session.checksum.value.toString())
                invoke.resolve(ret)
            } catch (ex: Exception) {
                invoke.reject(ex.message ?: "closeWrite failed")
            }
        }
    }

    @Command
    fun openRead(invoke: Invoke) {
        ioExecutor.execute {
            var opened: ParcelFileDescriptor? = null
            var stream: BufferedInputStream? = null
            try {
                val args = invoke.parseArgs(UriArgs::class.java)
                val uri = Uri.parse(args.uri)
                opened = activity.contentResolver.openFileDescriptor(uri, "r")
                if (opened == null) {
                    invoke.reject("Unable to open document for reading")
                    return@execute
                }
                val handle = nextHandle.getAndIncrement()
                val pfd = opened
                stream = BufferedInputStream(ParcelFileDescriptor.AutoCloseInputStream(pfd), BUFFER_SIZE)
                opened = null
                readSessions[handle] = ReadSession(stream, pfd)
                val ret = JSObject()
                ret.put("handle", handle)
                invoke.resolve(ret)
            } catch (ex: Exception) {
                try { stream?.close() } catch (_: Throwable) {}
                try { opened?.close() } catch (_: Throwable) {}
                invoke.reject(ex.message ?: "openRead failed")
            }
        }
    }

    @Command
    fun readChunk(invoke: Invoke) {
        ioExecutor.execute {
            try {
                val args = invoke.parseArgs(ReadChunkArgs::class.java)
                val session = readSessions[args.handle]
                    ?: run {
                        invoke.reject("invalid-read-handle")
                        return@execute
                    }
                val maxBytes = args.maxBytes.coerceIn(1, BUFFER_SIZE)
                val buf = ByteArray(maxBytes)
                val read = session.stream.read(buf)
                val ret = JSObject()
                if (read < 0) {
                    ret.put("done", true)
                    ret.put("data", "")
                } else {
                    val slice = buf.copyOf(read)
                    session.checksum.update(slice)
                    ret.put("done", false)
                    ret.put("data", Base64.encodeToString(slice, Base64.NO_WRAP))
                }
                invoke.resolve(ret)
            } catch (ex: Exception) {
                invoke.reject(ex.message ?: "readChunk failed")
            }
        }
    }

    @Command
    fun closeRead(invoke: Invoke) {
        ioExecutor.execute {
            try {
                val args = invoke.parseArgs(HandleArgs::class.java)
                val session = readSessions.remove(args.handle)
                    ?: run {
                        invoke.reject("invalid-read-handle")
                        return@execute
                    }
                var closeError: Throwable? = null
                try {
                    session.stream.close()
                } catch (t: Throwable) {
                    closeError = t
                }
                try {
                    session.pfd?.close()
                } catch (_: Throwable) {}

                if (closeError != null) throw (closeError as? Exception ?: Exception(closeError))

                val ret = JSObject()
                ret.put("checksum", session.checksum.value.toString())
                invoke.resolve(ret)
            } catch (ex: Exception) {
                invoke.reject(ex.message ?: "closeRead failed")
            }
        }
    }

    private fun queryDisplayName(uri: Uri): String? {
        activity.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex >= 0 && cursor.moveToFirst()) {
                return cursor.getString(nameIndex)
            }
        }
        return null
    }

    private fun queryLength(uri: Uri): Long {
        activity.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (sizeIndex >= 0 && cursor.moveToFirst() && !cursor.isNull(sizeIndex)) {
                return cursor.getLong(sizeIndex)
            }
        }
        val pfd = activity.contentResolver.openFileDescriptor(uri, "r") ?: return -1
        pfd.use { return it.statSize }
    }
}