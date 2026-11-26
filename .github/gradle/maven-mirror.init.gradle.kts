// Maven Central rate-limits shared GitHub runner IPs (429). Fetch from Google's public mirror first,
// keep Central last for anything the mirror lacks. Pattern from JetBrains support / Sonatype FAQ.
val mirror = "https://maven-central.storage-download.googleapis.com/maven2/"
beforeSettings {
    pluginManagement.repositories { maven { url = uri(mirror) }; gradlePluginPortal() }
    dependencyResolutionManagement.repositories { maven { url = uri(mirror) } }
}
allprojects {
    buildscript.repositories { maven { url = uri(mirror) } }
    repositories { maven { url = uri(mirror) } }
}
