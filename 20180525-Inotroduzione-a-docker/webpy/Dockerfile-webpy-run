FROM centos:7
MAINTAINER Davide Giunchi <davide@giunchi.net>
ADD ./* /
WORKDIR /
RUN yum install python -y && rpm -ivh http://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm && yum install python-pip -y && pip install awscli
CMD ["python","web.py"]
