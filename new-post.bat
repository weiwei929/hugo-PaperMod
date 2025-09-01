@echo off
set /p title="请输入文章标题: "
set filename=%title: =-%
set filename=%filename%
set date=%date:~0,4%-%date:~5,2%-%date:~8,2%
set time=%time:~0,2%:%time:~3,2%:%time:~6,2%

echo ---
echo title: "%title%"
echo date: %date%T%time%+08:00
echo draft: false
echo tags: []
echo categories: []
echo ---
echo.
echo ## 内容开始
echo.
echo 在这里写您的内容...
) > "content\posts\%filename%.md"

echo 文章已创建: content\posts\%filename%.md
pause