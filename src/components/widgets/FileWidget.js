import React, { Component } from "react";
import PropTypes from "prop-types";
import Rodal from "rodal";

import { dataURItoBlob, shouldRender } from "../../utils";

function addNameToDataURL(dataURL, name) {
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
}

function processFile(file) {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = event => {
      resolve({
        dataURL: addNameToDataURL(event.target.result, name),
        name,
        size,
        type,
      });
    };
    reader.readAsDataURL(file);
  });
}

function processFiles(files) {
  return Promise.all([].map.call(files, processFile));
}

function FilesInfo(props) {
  const { filesInfo } = props;
  if (filesInfo.length === 0) {
    return null;
  }
  return (
    <ul className="file-info">
      {filesInfo.map((fileInfo, key) => {
        const { name, size, type } = fileInfo;
        let cleanUpName = decodeURI(name);
        return (
          <li key={key}>
            <strong>{cleanUpName}</strong> ({type}, {size} bytes)
            <br />
          </li>
        );
      })}
    </ul>
  );
}

function extractFileInfo(dataURLs) {
  return dataURLs
    .filter(dataURL => typeof dataURL !== "undefined")
    .map(dataURL => {
      const { blob, name } = dataURItoBlob(dataURL);
      return {
        name: name,
        size: blob.size,
        type: blob.type,
      };
    });
}

class FileWidget extends Component {
  constructor(props) {
    super(props);
    const { value } = props;
    const values = Array.isArray(value) ? value : [value];
    this.state = {
      values,
      filesInfo: extractFileInfo(values),
      visible: false,
      modalWidth: 1000,
      animation: "slideUp",
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shouldRender(this, nextProps, nextState);
  }

  show() {
    this.setState({ visible: true });
  }

  hide() {
    this.setState({ visible: false });
  }

  onChange = event => {
    const { multiple, onChange } = this.props;
    processFiles(event.target.files).then(filesInfo => {
      const state = {
        values: filesInfo.map(fileInfo => fileInfo.dataURL),
        filesInfo,
      };
      this.setState(state, () => {
        if (multiple) {
          onChange(state.values);
        } else {
          onChange(state.values[0]);
        }
      });
    });
  };

  render() {
    const { multiple, id, readonly, disabled, autofocus, options } = this.props;
    const { filesInfo, values } = this.state;
    return (
      <div>
        <p>
          <input
            ref={ref => (this.inputRef = ref)}
            id={id}
            type="file"
            disabled={readonly || disabled}
            onChange={this.onChange}
            defaultValue=""
            autoFocus={autofocus}
            multiple={multiple}
            accept={options.accept}
          />
        </p>
        <FilesInfo filesInfo={filesInfo} />
        <button
          type="button"
          title="View File"
          className="btn-shadow btn btn-primary"
          onClick={this.show.bind(this)}>
          View
        </button>
        <Rodal
          visible={this.state.visible}
          onClose={this.hide.bind(this)}
          animation={this.state.animation}
          showMask={false}
          width={this.state.modalWidth}>
          <ModalHeader>Viewer</ModalHeader>
          <ModalBody>
            <div style={{ textAlign: "center" }}>
              <img src={values[0]} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={this.hide.bind(this)}>
              Close
            </Button>
          </ModalFooter>
        </Rodal>
      </div>
    );
  }
}

FileWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  FileWidget.propTypes = {
    multiple: PropTypes.bool,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    autofocus: PropTypes.bool,
  };
}

export default FileWidget;
