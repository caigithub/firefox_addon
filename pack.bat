rm %1.zip
rm %1.xpi

cd %1
zip -r ../%1.zip ./

cd ..
mv %1.zip %1.xpi
