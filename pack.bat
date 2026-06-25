@echo off
set "folderList=chat_outline;chat_jump"
rem set "folderList=chat_outline chat_outline1 chat_outline2"

for %%f in (%folderList%) do (
    cd .\%%f && zip -r ..\%%f.xpi . && zip -r ..\%%f.zip . && cd ..
)
